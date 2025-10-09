using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using System.Xml.Linq;
using TCCControleDeAcesso.Models;
using System.Runtime.InteropServices;


namespace TCCControleDeAcesso.Views
    {
        public partial class frmListaAlunos : Form  
    {
            CadastroAlunos cadastroAlunos;
            int id_escola;
            public string caminho;
            string idText;
            string _CurrentUsername;
        public int id_arduino {  get; set; }


        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]

                    private static extern IntPtr CreateRoundRectRgn
            (
            int nLeft,
            int nTop,
            int nRight,
            int nBottom,
            int nWidthEllipse,
            int nHeightEllipse
            );

        public frmListaAlunos(string currentUsername ,int idEsc)
            {
                InitializeComponent();
                SerialPortManager.Port.DataReceived += serialPort_DataReceived;
                id_escola = idEsc;
            _CurrentUsername = currentUsername;
            }

        public void CleanAll()
        {
            txtId.Clear();
            txtName.Clear();
            txtRm.Clear();
            txtIdade.Clear();
            cboCurso.SelectedIndex = -1;
            comboBox2.SelectedIndex = -1;
            txtIdOficial.Clear();
            pictureBox1.Image = null;
        }
        private void CarregarCursos()
        {
            string conexao = "server=localhost;port=3307;uid=root;pwd=etecjau;database=AccessControl;";
            string query = "SELECT nome FROM cursos where idEscola=@idEscola";

            using (MySqlConnection conn = new MySqlConnection(conexao))
            {
                try
                {
                    conn.Open();
                    MySqlCommand cmd = new MySqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@idEscola", id_escola);
                    MySqlDataReader reader = cmd.ExecuteReader();

                    while (reader.Read())
                    {
                        cboCurso.Items.Add(reader["nome"].ToString());
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao carregar cursos: " + ex.Message);
                }
            }
        }

        private void CarregarImagemDoAluno(string nome)
        {
            string connectionString = "server=localhost;port=3307;uid=root;pwd=etecjau;database=AccessControl;"; // Atualize conforme necessário
            string query = "SELECT foto FROM alunos WHERE nome = @nome";

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                try
                {
                    conn.Open();
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@nome", nome);

                        using (MySqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read() && !reader.IsDBNull(0))
                            {
                                byte[] imagemBytes = (byte[])reader["foto"];

                                using (MemoryStream ms = new MemoryStream(imagemBytes))
                                {
                                    pictureBox1.Image = Image.FromStream(ms);
                                }
                            }
                            else
                            {
                                pictureBox1.Image = null; // ou imagem padrão
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao carregar imagem: " + ex.Message);
                }
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            
            if (txtName.Text == string.Empty || txtRm.Text == string.Empty || txtIdade.Text == string.Empty || comboBox2.SelectedIndex == -1 || caminho == null || cboCurso.SelectedIndex == -1)
            {

                MessageBox.Show("Preencha todos os campos.", "Erro de Preenchimento.", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            cadastroAlunos = new CadastroAlunos()
            {
                Name = txtName.Text,
                rm = txtRm.Text,
                NomeCurso = cboCurso.SelectedItem.ToString(),
                idade = txtIdade.Text,
                serie = comboBox2.SelectedItem.ToString(),
                foto = File.ReadAllBytes(caminho),
                idEscola = id_escola
            };
            cadastroAlunos.Insert();

       

            string connStr = "server=localhost;port=3307;uid=root;pwd=etecjau;database=AccessControl;";
            int id = 0; // variável para armazenar o resultado

            using (var conn = new MySqlConnection(connStr))
            {
                conn.Open();

                string sql = "SELECT id FROM alunos where nome=@nome";
                using (var cmd = new MySqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@nome", txtName.Text);

                    object result = cmd.ExecuteScalar(); // pega a primeira coluna da primeira linha
                    if (result != null)
                    {
                        id = Convert.ToInt32(result);
                    }
                }
            }

            Console.WriteLine("ID encontrado: " + id);









            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
           // dgvAlunos.Columns["id"].Visible = false;
            CleanAll();

           
            txtArduino.Text = id.ToString();
            SerialPortManager.Port.Write("!enroll" + id + "#");
        }

        private void frmListaAlunos_Load(object sender, EventArgs e)
        {
            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
            //dgvAlunos.Columns["id"].Visible = false;

            CleanAll();
            CarregarCursos();

            BtnDelete.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, BtnDelete.Width, BtnDelete.Height, 20, 20));
            BtnDelete.FlatStyle = FlatStyle.Flat;
            BtnDelete.FlatAppearance.BorderSize = 1;  // sem borda
            BtnDelete.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            BtnDelete.ForeColor = Color.White; // texto branco

            btnVoltar.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnVoltar.Width, btnVoltar.Height, 20, 20));
            btnVoltar.FlatStyle = FlatStyle.Flat;
            btnVoltar.FlatAppearance.BorderSize = 1;  // sem borda
            btnVoltar.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnVoltar.ForeColor = Color.White; // texto branco

            btnSave.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnSave.Width, btnSave.Height, 20, 20));
            btnSave.FlatStyle = FlatStyle.Flat;
            btnSave.FlatAppearance.BorderSize = 1;  // sem borda
            btnSave.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnSave.ForeColor = Color.White; // texto branco

        }

        private void linkSelectPhoto_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "Imagens|*.jpg;*.jpeg;*.png;*.bmp";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                caminho = ofd.FileName;
                pictureBox1.ImageLocation = caminho; // opcional: mostra a imagem
            }
        }

        private void dgvAlunos_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvAlunos.Rows[e.RowIndex];

                // Recupere os valores das células


                idText = row.Cells["id"].Value.ToString();

                string nome = row.Cells["nome"].Value.ToString();
                string rm = row.Cells["rm"].Value.ToString();
                string idade = row.Cells["idade"].Value.ToString();
                object curso = row.Cells["curso"].Value;
                object serie = row.Cells["serie"].Value;

                txtId.Text = idText;
                txtName.Text = nome;
                txtRm.Text = rm;
                txtIdade.Text = idade;
                cboCurso.SelectedItem = curso;
                comboBox2.SelectedItem = serie;

                CarregarImagemDoAluno(nome);



            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (idText == null)
            {
                return;
            }
            else
            {

                cadastroAlunos = new CadastroAlunos()
                {
                    Id = int.Parse(idText)
                };
                cadastroAlunos.Delete();

                cadastroAlunos = new CadastroAlunos()
                {
                    idEscola = id_escola
                };
                dgvAlunos.DataSource = cadastroAlunos.ListStudents();
                dgvAlunos.Columns["id"].Visible = false;
                CleanAll();
            }
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            if (this.IsHandleCreated)
            {
                try
                {
                    string received = SerialPortManager.Port.ReadLine();

                    acao.Invoke(new Action(() => {
                        if (received.StartsWith("!enrolling"))
                        {
                            received = received.Replace("!enrolling", "");
                            received = received.Replace("#", "");
                            acao.Text = "Cadastrando o ID " + received;
                        }
                        else if (received.StartsWith("!placeFinger#"))
                        {
                            acao.Text = "Coloque o dedo no sensor";
                        }
                        else if (received.StartsWith("!imageTaken#"))
                        {
                            acao.Text = "Dedo capturado";
                        }
                        else if (received.StartsWith("!removeFinger#"))
                        {
                            acao.Text = "Tire o dedo do sensor";
                        }
                        else if (received.StartsWith("!enrolled"))
                        {
                            received = received.Replace("!enrolled", "");
                            received = received.Replace("#", "");
                            acao.Text = "ID" + received + " cadastrado";
                        }
                    }));
                }
                catch (IOException)
                {
                }
                catch (InvalidOperationException)
                {
                }
            }
        }

        private void FrmListaAlunos_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (SerialPortManager.Port.IsOpen)
            {
                SerialPortManager.Port.DataReceived -= serialPort_DataReceived;
            }
        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu(_CurrentUsername, id_escola);
            check.Show();
            Hide();
        }

        private void dgvAlunos_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }
    }
}
