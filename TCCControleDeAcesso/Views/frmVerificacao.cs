using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using Org.BouncyCastle.Asn1.Ocsp;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {

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

        bool verificando;
        Log log;
        int idAluno;
        DateTime dataAtual;
        int id_escola;

        Verificacao verificacao;

        string _CurrentUsername;

        public frmVerificacao(string currentUsername, int idEscola)
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
            _CurrentUsername = currentUsername;
            id_escola = idEscola;
        }

        private void btnVerificar_Click(object sender, EventArgs e)
        {
            if (!verificando)
            {
                SerialPortManager.Port.Write("!verify#");
                btnVerificar.Text = "Parar";
                progressBarVerificar.Value = 100;
                verificando = true;
            }
            else if (verificando)
            {
                SerialPortManager.Port.Write("!a#");
                btnVerificar.Text = "Verificar";
                progressBarVerificar.Value = 0;
                verificando = false;
            }
        }

        private void CarregarImagemDoAluno(int id)
        {
            string connectionString = "server=localhost;port=3306;uid=root;pwd=etecjau;database=accesscontrol;"; // Atualize conforme necessário
            string query = "SELECT foto FROM alunos WHERE id = @id";

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                try
                {
                    conn.Open();
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@id", id);

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

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            try
            {
                string received = SerialPortManager.Port.ReadLine();

                aluno.Invoke(new Action(() => {
                    if (received.StartsWith("!found"))
                    {
                        received = received.Replace("!found", "");
                        received = received.Replace("#", "");
                        aluno.Text = received;

                        verificacao = new Verificacao()
                        {
                            Id = int.Parse(received)
                        };
                        var dt = verificacao.select();
                        if (dt.Rows.Count > 0)
                        {
                            lblRM.Text = dt.Rows[0]["rm"].ToString();
                            lblNome.Text = dt.Rows[0]["nome"].ToString();
                            lblSerie.Text = dt.Rows[0]["serie"].ToString();
                            lblCurso.Text = dt.Rows[0]["curso"].ToString();
                        }


                        CarregarImagemDoAluno(1);

                        dataAtual = DateTime.Now;
                        idAluno = int.Parse(received);

                        log = new Log();
                        log.insert(idAluno, dataAtual, id_escola);


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

        private void FrmListaAlunos_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (SerialPortManager.Port.IsOpen)
            {
                SerialPortManager.Port.DataReceived -= serialPort_DataReceived;
                SerialPortManager.Port.Write("!a#");
            }
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            if (SerialPortManager.Port != null && SerialPortManager.Port.IsOpen)
            {
                // Remove o evento e envia o comando
                SerialPortManager.Port.DataReceived -= serialPort_DataReceived;

                try
                {
                    SerialPortManager.Port.Write("!a#");
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao enviar comando para o Arduino: " + ex.Message,
                                    "Erro de comunicação",
                                    MessageBoxButtons.OK,
                                    MessageBoxIcon.Warning);
                }
            }
            else
            {
                MessageBox.Show("Arduino não está conectado ou a porta serial não está aberta.",
                                "Aviso",
                                MessageBoxButtons.OK,
                                MessageBoxIcon.Information);
            }

            // Continua a execução normalmente
            frmMainMenu check = new frmMainMenu(_CurrentUsername, id_escola);
            check.Show();

            Hide();
        }

        private void frmVerificacao_Load(object sender, EventArgs e)
        {

            btnVerificar.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnVerificar.Width, btnVerificar.Height, 20, 20));
            btnVerificar.FlatStyle = FlatStyle.Flat;
            btnVerificar.FlatAppearance.BorderSize = 1;  // sem borda
            btnVerificar.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnVerificar.ForeColor = Color.White; // texto branco

            btnVoltar.Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, btnVoltar.Width, btnVoltar.Height, 20, 20));
            btnVoltar.FlatStyle = FlatStyle.Flat;
            btnVoltar.FlatAppearance.BorderSize = 1;  // sem borda
            btnVoltar.BackColor = Color.FromArgb(52, 188, 251); // #34BCFB
            btnVoltar.ForeColor = Color.White; // texto branco

        }

    

        private void label1_Click_1(object sender, EventArgs e)
        {

        }
    }
}
