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
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmListaAlunos : Form
    {
        CadastroAlunos cadastroAlunos;
        int id_escola;
        public string caminho;
        string idText;

        public frmListaAlunos(int idEsc)
        {
            InitializeComponent();
            id_escola = idEsc;
        }

        private void frmListaAlunos_Load(object sender, EventArgs e)
        {
            cadastroAlunos = new CadastroAlunos() {
                idEscola = id_escola
            };
           dgvAlunos.DataSource = cadastroAlunos.ListStudents();
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

        private void btnSave_Click(object sender, EventArgs e)
        {
            if (txtName.Text == string.Empty ||  txtIdade.Text == string.Empty || comboBox2.SelectedIndex == -1) return;
            cadastroAlunos = new CadastroAlunos()
            {
                Name = txtName.Text,
                rm = txtRm.Text,
                //idCurso = txtCurso.Text,
                idade= txtIdade.Text,
                serie = comboBox2.SelectedItem.ToString(),
                foto = File.ReadAllBytes(caminho),
                idEscola = id_escola
            };
            cadastroAlunos.Insert();

            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
        }

        private void dgvAlunos_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvAlunos.Rows[e.RowIndex];

                // Recupere os valores das células
                idText=row.Cells["id"].Value.ToString();
                string nome = row.Cells["nome"].Value.ToString();
                string rm = row.Cells["rm"].Value.ToString();
                string idade = row.Cells["idade"].Value.ToString();
                // object curso = row.Cells["curso"].Value;
                object serie = row.Cells["serie"].Value;

                txtId.Text = idText;
               txtName.Text = nome;
               txtRm.Text = rm;
               txtIdade.Text = idade;
                //cboCurso.SelectedItem = Curso;
               comboBox2.SelectedItem = serie;

                CarregarImagemDoAluno(nome);



            }
        }
        private void CarregarImagemDoAluno(string nome)
        {
            string connectionString = "server=localhost;port=3306;uid=root;pwd=etecjau;database=accesscontrol;"; // Atualize conforme necessário
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

        private void BtnDelete_Click(object sender, EventArgs e)
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
        }
    }

    
}
