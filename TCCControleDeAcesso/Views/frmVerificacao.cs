using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using MySql.Data.MySqlClient;
using Org.BouncyCastle.Asn1.Ocsp;
using TCCControleDeAcesso.Models;

namespace TCCControleDeAcesso.Views
{
    public partial class frmVerificacao : Form
    {
        bool verificando;
        Log log;
        int idAluno;
        DateTime dataAtual;
        int id_escola;

        Verificacao verificacao;

        public frmVerificacao()
        {
            InitializeComponent();
            SerialPortManager.Port.DataReceived += serialPort_DataReceived;
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
            string connectionString = "server=localhost;port=3306;uid=root;pwd=1234;database=accesscontrol;"; // Atualize conforme necessário
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
            }
        }

        private void label1_Click(object sender, EventArgs e)
        {

        }

        private void btnVoltar_Click(object sender, EventArgs e)
        {
            frmMainMenu check = new frmMainMenu("", 0);
            check.Show();
            Hide();
        }

        private void frmVerificacao_Load(object sender, EventArgs e)
        {
           
        }
    }
}
